import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { testimonialService } from '@/services/testimonialService';
import { Testimonial, TestimonialStatus } from '@/types/testimonial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle, XCircle, Clock, Edit, Trash2, Eye, Filter, Loader2 } from 'lucide-react';

export function TestimonialManagement() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TestimonialStatus | 'all'>('all');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editForm, setEditForm] = useState({
    testimonialText: '',
    clientName: '',
    clientTitle: '',
    companyName: '',
    reviewNotes: '',
  });

  useEffect(() => {
    loadTestimonials();
  }, [filterStatus]);

  async function loadTestimonials() {
    setLoading(true);
    try {
      let data: Testimonial[];
      if (filterStatus === 'all') {
        data = await testimonialService.getAllTestimonials();
      } else {
        data = await testimonialService.getTestimonialsByStatus(filterStatus);
      }
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleModeration(testimonialId: string, status: TestimonialStatus, notes?: string) {
    if (!user) return;

    try {
      await testimonialService.moderateTestimonial(testimonialId, user.id, {
        status,
        reviewNotes: notes,
      });
      await loadTestimonials();
      setSelectedTestimonial(null);
    } catch (error) {
      console.error('Failed to moderate testimonial:', error);
    }
  }

  async function handleEdit() {
    if (!user || !editingTestimonial) return;

    try {
      await testimonialService.moderateTestimonial(editingTestimonial.id, user.id, {
        status: editingTestimonial.status,
        editedText: editForm.testimonialText,
        editedClientName: editForm.clientName,
        editedClientTitle: editForm.clientTitle,
        editedCompanyName: editForm.companyName,
        reviewNotes: editForm.reviewNotes,
      });
      await loadTestimonials();
      setEditingTestimonial(null);
      setEditForm({
        testimonialText: '',
        clientName: '',
        clientTitle: '',
        companyName: '',
        reviewNotes: '',
      });
    } catch (error) {
      console.error('Failed to edit testimonial:', error);
    }
  }

  async function handleDelete(testimonialId: string) {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }

    try {
      await testimonialService.deleteTestimonial(testimonialId, user.id);
      await loadTestimonials();
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  }

  function openEditModal(testimonial: Testimonial) {
    setEditingTestimonial(testimonial);
    setEditForm({
      testimonialText: testimonial.testimonialText,
      clientName: testimonial.clientName,
      clientTitle: testimonial.clientTitle,
      companyName: testimonial.companyName,
      reviewNotes: testimonial.reviewNotes || '',
    });
  }

  function getStatusBadge(status: TestimonialStatus) {
    const config = {
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Pending Review' },
      approved: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50', label: 'Approved' },
      published: { icon: Eye, color: 'text-green-600 bg-green-50', label: 'Published' },
      rejected: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' },
      changes_requested: { icon: Edit, color: 'text-orange-600 bg-orange-50', label: 'Changes Requested' },
      archived: { icon: Clock, color: 'text-gray-600 bg-gray-50', label: 'Archived' },
    };

    const { icon: Icon, color, label } = config[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access the testimonial management interface.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Testimonial Management</h2>
          <p className="text-gray-600 mt-1">Review and manage customer testimonials</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'published', 'rejected', 'changes_requested', 'archived'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-12">
              No testimonials found{filterStatus !== 'all' ? ` with status "${filterStatus}"` : ''}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(testimonial.status)}
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < testimonial.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <blockquote className="text-gray-700 italic border-l-4 border-blue-500 pl-4">
                      "{testimonial.testimonialText}"
                    </blockquote>

                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{testimonial.clientName}</p>
                      <p>{testimonial.clientTitle}</p>
                      <p className="text-gray-500">{testimonial.companyName}</p>
                    </div>

                    <div className="text-xs text-gray-400">
                      Submitted: {new Date(testimonial.submittedAt).toLocaleDateString()}
                      {testimonial.reviewedAt && (
                        <span className="ml-4">
                          Reviewed: {new Date(testimonial.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTestimonial(testimonial)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(testimonial)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(testimonial.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Testimonial Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTestimonial(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedTestimonial.status)}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < selectedTestimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <blockquote className="text-gray-700 italic border-l-4 border-blue-500 pl-4 py-2">
                "{selectedTestimonial.testimonialText}"
              </blockquote>

              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-gray-500">Client Name</Label>
                  <p className="font-medium">{selectedTestimonial.clientName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Title</Label>
                  <p>{selectedTestimonial.clientTitle}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Company</Label>
                  <p>{selectedTestimonial.companyName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Consent</Label>
                  <p>{selectedTestimonial.consentGiven ? 'Given' : 'Not given'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Submitted</Label>
                  <p>{new Date(selectedTestimonial.submittedAt).toLocaleString()}</p>
                </div>
                {selectedTestimonial.reviewedAt && (
                  <div>
                    <Label className="text-gray-500">Reviewed</Label>
                    <p>{new Date(selectedTestimonial.reviewedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedTestimonial.reviewNotes && (
                  <div>
                    <Label className="text-gray-500">Review Notes</Label>
                    <p className="text-gray-700">{selectedTestimonial.reviewNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedTestimonial.status === 'pending' && (
                  <>
                    <Button onClick={() => handleModeration(selectedTestimonial.id, 'approved')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleModeration(selectedTestimonial.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleModeration(selectedTestimonial.id, 'changes_requested')}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </>
                )}
                {selectedTestimonial.status === 'approved' && (
                  <Button onClick={() => handleModeration(selectedTestimonial.id, 'published')}>
                    <Eye className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
                {selectedTestimonial.status === 'published' && (
                  <Button
                    variant="outline"
                    onClick={() => handleModeration(selectedTestimonial.id, 'approved')}
                  >
                    Unpublish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit Testimonial</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingTestimonial(null)}>
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-text">Testimonial Text</Label>
                <textarea
                  id="edit-text"
                  value={editForm.testimonialText}
                  onChange={(e) => setEditForm({ ...editForm, testimonialText: e.target.value })}
                  className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Client Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Client Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.clientTitle}
                    onChange={(e) => setEditForm({ ...editForm, clientTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company">Company Name</Label>
                <Input
                  id="edit-company"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Review Notes</Label>
                <textarea
                  id="edit-notes"
                  value={editForm.reviewNotes}
                  onChange={(e) => setEditForm({ ...editForm, reviewNotes: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about the review or edits made..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleEdit}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingTestimonial(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
